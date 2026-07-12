from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class UserAuthTestCase(APITestCase):
    def setUp(self):
        self.signup_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.profile_url = '/api/auth/profile/'
        
    def test_signup_successful(self):
        payload = {
            'username': 'test_manager',
            'email': 'manager@test.com',
            'password': 'Password123!',
            'role': 'FLEET_MANAGER'
        }
        res = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['username'], 'test_manager')
        self.assertEqual(res.data['role'], 'FLEET_MANAGER')
        self.assertTrue(User.objects.filter(username='test_manager').exists())

    def test_signup_missing_fields(self):
        payload = {
            'email': 'manager_bad@test.com',
            'password': 'Password123!'
        }
        res = self.client.post(self.signup_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_successful(self):
        User.objects.create_user(
            username='test_login_user',
            email='l@test.com',
            password='Password123!',
            role='DRIVER'
        )
        payload = {
            'username': 'test_login_user',
            'password': 'Password123!'
        }
        res = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_invalid_credentials(self):
        payload = {
            'username': 'nonexistent',
            'password': 'wrongpassword'
        }
        res = self.client.post(self.login_url, payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_retrieval_authenticated(self):
        user = User.objects.create_user(
            username='profile_user',
            email='p@test.com',
            password='Password123!',
            role='SAFETY_OFFICER'
        )
        self.client.force_authenticate(user=user)
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'profile_user')
        self.assertEqual(res.data['role'], 'SAFETY_OFFICER')

    def test_profile_retrieval_unauthenticated(self):
        res = self.client.get(self.profile_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
